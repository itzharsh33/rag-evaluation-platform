-- Fresh semantic relevance labels generated from the uploaded 302-row chunk mapping and 50-question benchmark.
-- Updates only benchmark_questions.relevant_semantic_chunk_ids; relevant_chunk_ids is not modified.
-- Requires relevant_semantic_chunk_ids to be a JSONB column.
BEGIN;

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["45171d4e-2948-46cb-a829-9520a5b331e2", "f5d36db7-b4e6-43c7-8e11-2a307b85f62d"]'::jsonb
WHERE id = 'pg18-001' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["d150ba73-6308-48a2-96e8-a7909aa8d0a2", "0505806c-b3d8-4f42-b6d6-18126e786694"]'::jsonb
WHERE id = 'pg18-002' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["b23b6e38-66c5-4ca1-9625-2d6017a6d66f", "f5d36db7-b4e6-43c7-8e11-2a307b85f62d"]'::jsonb
WHERE id = 'pg18-003' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["fe57562e-ece5-445b-a4d3-03d1abd1d817", "ec6cd8f7-6ca0-4f31-9810-c6c87a2fc834"]'::jsonb
WHERE id = 'pg18-004' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["2af5b314-358b-481e-80bc-8517d03ef272", "157ef280-a91b-4b6c-b5c0-f31c516773c6"]'::jsonb
WHERE id = 'pg18-005' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["1354a2c5-4ae1-4211-a2de-ad1441176275", "78a5a766-be0c-4c2c-abdb-9d655635537d"]'::jsonb
WHERE id = 'pg18-006' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["21fd7f18-2089-40e6-8fb9-845df099d654", "8d22e808-2159-407c-ab08-f2efd45df913"]'::jsonb
WHERE id = 'pg18-007' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["bd32f867-09ed-4f68-846f-33115c38ca33", "1354a2c5-4ae1-4211-a2de-ad1441176275"]'::jsonb
WHERE id = 'pg18-008' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["6934981e-bb32-4605-9163-012182dc6e26", "11c8b701-3efa-43c7-b64c-d2eadd14f7e2"]'::jsonb
WHERE id = 'pg18-009' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["6934981e-bb32-4605-9163-012182dc6e26", "11c8b701-3efa-43c7-b64c-d2eadd14f7e2"]'::jsonb
WHERE id = 'pg18-010' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["11c8b701-3efa-43c7-b64c-d2eadd14f7e2", "6934981e-bb32-4605-9163-012182dc6e26"]'::jsonb
WHERE id = 'pg18-011' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["1a208a71-ac3d-458a-8b4e-59c3a15b3a1b", "614ed9a9-44bd-44d6-8fa5-6ebb1695c757"]'::jsonb
WHERE id = 'pg18-012' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["ab16510b-44ae-4d04-82f1-2b9c8c766ff5", "6b134f4d-7976-4180-bf8a-2aeb823963fb"]'::jsonb
WHERE id = 'pg18-013' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["ab16510b-44ae-4d04-82f1-2b9c8c766ff5", "6b134f4d-7976-4180-bf8a-2aeb823963fb"]'::jsonb
WHERE id = 'pg18-014' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["6b134f4d-7976-4180-bf8a-2aeb823963fb", "51f7aa5a-5113-427e-9e4c-9476299f7b57"]'::jsonb
WHERE id = 'pg18-015' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["6b134f4d-7976-4180-bf8a-2aeb823963fb", "ab16510b-44ae-4d04-82f1-2b9c8c766ff5"]'::jsonb
WHERE id = 'pg18-016' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["07efb857-23ca-4a38-9db3-e13ff1fbce48", "0caf54e9-345e-449d-8c18-5395e850c595"]'::jsonb
WHERE id = 'pg18-017' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["be511fdb-17ab-4266-b07a-e34b06496941", "27d1a9db-b32e-4d5d-9c3c-5f50ed3c2e09"]'::jsonb
WHERE id = 'pg18-018' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["aeaf997f-0f1c-43bb-9a76-7281317ac6a7", "1b12f208-5742-44bd-8d1d-5550f23cc805"]'::jsonb
WHERE id = 'pg18-019' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["aeaf997f-0f1c-43bb-9a76-7281317ac6a7", "1b12f208-5742-44bd-8d1d-5550f23cc805"]'::jsonb
WHERE id = 'pg18-020' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["1b12f208-5742-44bd-8d1d-5550f23cc805", "aeaf997f-0f1c-43bb-9a76-7281317ac6a7"]'::jsonb
WHERE id = 'pg18-021' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["2c3dad51-c11a-4232-923f-b9167f895020", "bfd41ed3-b0d8-40fd-84b1-4ce6fede1159"]'::jsonb
WHERE id = 'pg18-022' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["bfd41ed3-b0d8-40fd-84b1-4ce6fede1159", "2c3dad51-c11a-4232-923f-b9167f895020"]'::jsonb
WHERE id = 'pg18-023' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["a896fb35-e9a3-411c-bcd6-ec9b4635ea6c", "f2cb8384-be73-4e81-b5ad-3ce1769594b8"]'::jsonb
WHERE id = 'pg18-024' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["a896fb35-e9a3-411c-bcd6-ec9b4635ea6c", "741382ac-d977-4f6a-a062-9c495fdc9ec5"]'::jsonb
WHERE id = 'pg18-025' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["db78ee8c-81f0-4bda-891b-c0ea9cbb344b", "12283c7f-d5c6-49b2-95ca-7e36becde211"]'::jsonb
WHERE id = 'pg18-026' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["24093023-2d28-411d-bcc2-19e67f0a45f2", "12283c7f-d5c6-49b2-95ca-7e36becde211"]'::jsonb
WHERE id = 'pg18-027' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["88d54d25-f717-4cb8-b018-f31a0c3098cd", "75755c09-9bdf-4565-9177-dca70ef8c68f"]'::jsonb
WHERE id = 'pg18-028' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["75755c09-9bdf-4565-9177-dca70ef8c68f", "70781a93-682e-4ebb-b542-a8db8279371e"]'::jsonb
WHERE id = 'pg18-029' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["5f5f5fa7-0e95-4f82-a7af-01252edee80b", "12283c7f-d5c6-49b2-95ca-7e36becde211"]'::jsonb
WHERE id = 'pg18-030' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["84024e3d-0beb-4f45-87b4-7dca87d24e67", "5f5f5fa7-0e95-4f82-a7af-01252edee80b"]'::jsonb
WHERE id = 'pg18-031' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["41bffff2-217d-415b-b3bf-c601f64cd476", "89a04501-10bb-4b14-96d8-e796d20d3969"]'::jsonb
WHERE id = 'pg18-032' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["29bfbf91-00f2-4d2f-8798-25155a787d49", "5c0eb369-f3ce-4393-b55f-99e6c1b8d848"]'::jsonb
WHERE id = 'pg18-033' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["4b31e156-39af-43a6-83e1-1dd67d69d8dd", "b218af59-8f70-49eb-a68b-a2593faaadc1"]'::jsonb
WHERE id = 'pg18-034' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["5c0eb369-f3ce-4393-b55f-99e6c1b8d848", "f5e0082d-d080-4792-825c-16265e0248fb"]'::jsonb
WHERE id = 'pg18-035' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["67e1e1d6-2229-42ad-acd7-dca24397ae9c", "b875e35e-e405-4ff7-956d-c30406db1eb8"]'::jsonb
WHERE id = 'pg18-036' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["b875e35e-e405-4ff7-956d-c30406db1eb8", "964d8654-2ded-4651-b00a-4eb3bf8ba4b8"]'::jsonb
WHERE id = 'pg18-037' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["e3361715-9efa-41b0-97b9-63262ee2cf38", "ba55b1e9-5e7f-406a-a23f-69395510460a"]'::jsonb
WHERE id = 'pg18-038' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["509b1841-d99c-4f5b-b3a7-99c511d9be5a", "ba55b1e9-5e7f-406a-a23f-69395510460a"]'::jsonb
WHERE id = 'pg18-039' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["a032ab13-f2ec-4cf4-9929-cd27a48d6236", "19f48514-02d1-462e-9a06-241fec61861a"]'::jsonb
WHERE id = 'pg18-040' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["ba55b1e9-5e7f-406a-a23f-69395510460a", "52b369fb-0897-4313-a5fa-23ae61614dbf"]'::jsonb
WHERE id = 'pg18-041' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["a032ab13-f2ec-4cf4-9929-cd27a48d6236", "55199d2f-99f3-4399-b8ea-5fff957c7af6"]'::jsonb
WHERE id = 'pg18-042' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["31dc1e8a-68b5-4e87-805a-84eabe9acc7f", "96cb3abb-0cbd-408a-a928-fdbdd0c5b9e2"]'::jsonb
WHERE id = 'pg18-043' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["1d079a76-6d5c-43a7-a36a-2c4ae9b13ab6", "31dc1e8a-68b5-4e87-805a-84eabe9acc7f"]'::jsonb
WHERE id = 'pg18-044' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["8d60e08f-9b4c-47d3-a2d0-c727360ebcfa", "f810313a-463b-4aa0-b350-66fcd71a5949"]'::jsonb
WHERE id = 'pg18-045' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["154189e0-78e3-4b18-830e-ed11c827b255", "88916b7d-3bc6-463f-a1ba-e5ae4dda7b2e"]'::jsonb
WHERE id = 'pg18-046' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["96cb3abb-0cbd-408a-a928-fdbdd0c5b9e2", "b7d31762-0186-4810-b933-171ba1a9a499"]'::jsonb
WHERE id = 'pg18-047' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["f302e978-4712-44d1-90ca-fc61fdea0cab", "5cd5e404-f85f-4a84-b0ba-2cfe254d6927"]'::jsonb
WHERE id = 'pg18-048' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["8d163317-817e-466d-88b2-da1101c87157", "b644fec8-56bf-49cc-b146-b07a96776f32"]'::jsonb
WHERE id = 'pg18-049' AND dataset_version = 'postgresql-v1';

UPDATE benchmark_questions
SET relevant_semantic_chunk_ids = '["932d5abd-65f5-4035-9556-d532ed8dc554", "8d3ed0cd-9f7b-4c28-8331-d812711f3f7c"]'::jsonb
WHERE id = 'pg18-050' AND dataset_version = 'postgresql-v1';

-- Verify all 50 benchmark questions have exactly two semantic gold IDs.
DO $$
DECLARE
  bad_count integer;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM benchmark_questions
  WHERE dataset_version = 'postgresql-v1'
    AND id LIKE 'pg18-%'
    AND CASE
          WHEN jsonb_typeof(relevant_semantic_chunk_ids) = 'array'
          THEN jsonb_array_length(relevant_semantic_chunk_ids) = 2
          ELSE FALSE
        END = FALSE;
  IF bad_count <> 0 THEN
    RAISE EXCEPTION 'Semantic gold-label validation failed for % benchmark rows', bad_count;
  END IF;
  IF (SELECT COUNT(*) FROM benchmark_questions
      WHERE dataset_version = 'postgresql-v1' AND id LIKE 'pg18-%') <> 50 THEN
    RAISE EXCEPTION 'Expected exactly 50 benchmark questions for postgresql-v1';
  END IF;
END $$;

COMMIT;
