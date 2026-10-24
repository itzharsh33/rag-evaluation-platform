import { Router } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { PoolClient } from "pg";

import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { extractDocumentText } from "../services/document-extractor.js";
import { chunkText } from "../services/chunker.js";
import { embedTexts } from "../services/embeddings.js";
import { semanticChunkText } from "../services/semantic-chunker.js";

export const documentsRouter = Router();

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, env.uploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = file.mimetype === "application/pdf" ? ".pdf" : ".docx";

    callback(null, `${randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Only PDF and DOCX files are supported."));
      return;
    }

    callback(null, true);
  },
});

documentsRouter.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, async (error) => {
    if (error) {
      next(error);
      return;
    }

    let client: PoolClient | undefined;
    let filePath: string | undefined;

    try {
      if (!req.file) {
        res.status(400).json({
          error: "Upload a PDF or DOCX file using the field name 'file'.",
        });
        return;
      }

      filePath = req.file.path;

      const extractedDocument = await extractDocumentText(
        req.file.path,
        req.file.mimetype,
      );

      //   const chunks = chunkText(extractedDocument.text, 1000, 150);

      let nextChunkIndex = 0;

      const chunks = extractedDocument.pages.flatMap((page) =>
        chunkText(page.text, 1000, 150).map((chunk) => ({
          index: nextChunkIndex++,
          content: chunk.content,
          pageNumber: page.pageNumber,
        })),
      );

      if (chunks.length === 0) {
        throw new Error("The document did not produce any usable chunks.");
      }

      const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

      const documentHash = createHash("sha256")
        .update(await fs.readFile(req.file.path))
        .digest("hex");

      await fs.mkdir(env.uploadDir, { recursive: true });

      client = await pool.connect();
      await client.query("BEGIN");

      const documentResult = await client.query<{ id: string }>(
        `INSERT INTO documents (
           workspace_id, collection, filename, storage_key,
           content_hash, page_count, chunk_count, status,
           chunking_strategy, chunk_size, corpus_version
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          env.workspaceId,
          "workspace",
          req.file.originalname,
          path.basename(req.file.path),
          documentHash,
          extractedDocument.pageCount,
          chunks.length,
          "ready",
          "fixed",
          1000,
          "workspace-v1",
        ],
      );

      const insertedDocument = documentResult.rows[0];

      if (!insertedDocument) {
        throw new Error("Failed to create the document record.");
      }

      const documentId = insertedDocument.id;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        if (!chunk || !embedding) {
          throw new Error(`Missing chunk or embedding at index ${i}.`);
        }

        await client.query(
          `INSERT INTO chunks (
     document_id,
     workspace_id,
     collection,
     chunk_index,
     content,
     page_number,
     content_hash,
     embedding
   )
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)`,
          [
            documentId,
            env.workspaceId,
            "workspace",
            chunk.index,
            chunk.content,
            chunk.pageNumber,
            createHash("sha256").update(chunk.content).digest("hex"),
            `[${embedding.join(",")}]`,
          ],
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Document uploaded and indexed successfully.",
        document: {
          id: documentId,
          filename: req.file.originalname,
          chunkCount: chunks.length,
          status: "ready",
        },
      });
    } catch (error) {
      if (client) {
        await client.query("ROLLBACK").catch(() => undefined);
      }

      if (filePath) {
        await fs.unlink(filePath).catch(() => undefined);
      }

      next(error);
    } finally {
      client?.release();
    }
  });
});

documentsRouter.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, filename, content_hash, chunk_count, status,
              chunking_strategy, created_at
       FROM documents
       WHERE workspace_id = $1 AND collection = 'workspace'
       ORDER BY created_at DESC`,
      [env.workspaceId],
    );

    res.json({ documents: result.rows });
  } catch (error) {
    next(error);
  }
});

documentsRouter.get("/:id/chunks", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.chunk_index, c.content, c.page_number
       FROM chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.id = $1
         AND d.workspace_id = $2
         AND d.collection = 'workspace'
       ORDER BY c.chunk_index`,
      [req.params.id, env.workspaceId],
    );

    res.json({ chunks: result.rows });
  } catch (error) {
    next(error);
  }
});

documentsRouter.delete("/:id", async (req, res, next) => {
  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query<{ storage_key: string }>(
      `SELECT storage_key
       FROM documents
       WHERE id = $1 AND workspace_id = $2
         AND collection = 'workspace'
       FOR UPDATE`,
      [req.params.id, env.workspaceId],
    );

    const document = result.rows[0];

    if (!document) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Document not found." });
      return;
    }

    await client.query("DELETE FROM chunks WHERE document_id = $1", [
      req.params.id,
    ]);

    await client.query(
      `DELETE FROM documents
       WHERE id = $1 AND workspace_id = $2`,
      [req.params.id, env.workspaceId],
    );

    await client.query("COMMIT");

    // Uploaded files are stored under the configured upload directory.
    const safeFilename = path.basename(document.storage_key);
    await fs
      .unlink(path.join(env.uploadDir, safeFilename))
      .catch(() => undefined);

    res.json({ message: "Document deleted successfully." });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => undefined);
    }
    next(error);
  } finally {
    client?.release();
  }
});

documentsRouter.post("/:id/index-semantic", async (req, res, next) => {
  const documentId = req.params.id;

  try {
    // Only index documents belonging to the current workspace.
    const documentResult = await pool.query<{
      id: string;
      filename: string;
      storage_key: string;
    }>(
      `
        SELECT id, filename, storage_key
        FROM documents
        WHERE id = $1
          AND workspace_id = $2
          AND collection = 'workspace'
      `,
      [documentId, env.workspaceId],
    );

    const document = documentResult.rows[0];

    if (!document) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Use the stored basename, not a path supplied by the request.
    const safeStorageKey = path.basename(document.storage_key);
    const filePath = path.join(env.uploadDir, safeStorageKey);

    const extension = path.extname(document.filename).toLowerCase();

    const mimeType =
      extension === ".pdf"
        ? "application/pdf"
        : extension === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : null;

    if (!mimeType) {
      res.status(400).json({ error: "Unsupported document type" });
      return;
    }

    const extracted = await extractDocumentText(filePath, mimeType);

    // Chunk each extracted page separately so citations retain page numbers.
    let nextIndex = 0;

    const chunks = extracted.pages.flatMap((page) =>
      semanticChunkText(page.text, 1200, 300).map((chunk) => ({
        index: nextIndex++,
        content: chunk.content,
        pageNumber: page.pageNumber,
      })),
    );

    if (chunks.length === 0) {
      res.status(400).json({
        error: "No text was extracted from this document",
      });
      return;
    }

    // Generate embeddings before starting the replacement transaction.
    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Replace only this document's semantic version.
      // Fixed chunks are left untouched.
      await client.query(
        `
          DELETE FROM chunks
          WHERE document_id = $1
            AND workspace_id = $2
            AND chunking_strategy = 'semantic'
        `,
        [documentId, env.workspaceId],
      );

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        if (!chunk) {
          throw new Error(`Missing chunk at index ${i}`);
        }

        if (!embedding) {
          throw new Error(`Missing embedding for chunk ${i}`);
        }

        const contentHash = createHash("sha256")
          .update(chunk.content)
          .digest("hex");

        await client.query(
          `
            INSERT INTO chunks (
              document_id,
              workspace_id,
              collection,
              chunk_index,
              content,
              page_number,
              content_hash,
              embedding,
              chunking_strategy
            )
            VALUES ($1, $2, 'workspace', $3, $4, $5, $6, $7::vector, 'semantic')
          `,
          [
            documentId,
            env.workspaceId,
            chunk.index,
            chunk.content,
            chunk.pageNumber,
            contentHash,
            JSON.stringify(embedding),
          ],
        );
      }

      await client.query("COMMIT");

      res.json({
        documentId,
        strategy: "semantic",
        chunksCreated: chunks.length,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});
