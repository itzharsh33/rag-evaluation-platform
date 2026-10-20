# Benchmark Corpus

## Topic
Official PostgreSQL 18 documentation: data definition (tables, constraints, partitioning, privileges, row security), indexing, numeric data types, and system limits.

## Corpus version
v1

## Source documents
All sources are from the official PostgreSQL 18 manual (major version pinned in the URL). Access date for all: 2026-10-20. For each page, record the exact minor version (18.x) shown on the page if available.

1. Title: 5.5. Constraints
   - Official URL: https://www.postgresql.org/docs/18/ddl-constraints.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License (permissive; copyright notice and license paragraphs must be kept in copies)
   - Downloaded filename: pg18_ddl-constraints.html

2. Title: 5.12. Table Partitioning
   - Official URL: https://www.postgresql.org/docs/18/ddl-partitioning.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_ddl-partitioning.html

3. Title: 5.7. Modifying Tables
   - Official URL: https://www.postgresql.org/docs/18/ddl-alter.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_ddl-alter.html

4. Title: 5.4. Generated Columns
   - Official URL: https://www.postgresql.org/docs/18/ddl-generated-columns.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_ddl-generated-columns.html

5. Title: 5.9. Row Security Policies
   - Official URL: https://www.postgresql.org/docs/18/ddl-rowsecurity.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_ddl-rowsecurity.html

6. Title: 5.8. Privileges
   - Official URL: https://www.postgresql.org/docs/18/ddl-priv.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_ddl-priv.html

7. Title: 11.2. Index Types
   - Official URL: https://www.postgresql.org/docs/18/indexes-types.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_indexes-types.html

8. Title: 8.1. Numeric Types
   - Official URL: https://www.postgresql.org/docs/18/datatype-numeric.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_datatype-numeric.html

9. Title: Appendix K. PostgreSQL Limits
   - Official URL: https://www.postgresql.org/docs/18/limits.html
   - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
   - License/reuse terms: PostgreSQL License
   - Downloaded filename: pg18_limits.html

10. Title: Legal Notice (license text, stored with the corpus to satisfy the license condition)
    - Official URL: https://www.postgresql.org/docs/18/legalnotice.html
    - Publication or version date: PostgreSQL 18 documentation, accessed 2026-10-20
    - License/reuse terms: PostgreSQL License
    - Downloaded filename: pg18_legalnotice.html

## Selection notes
These documents contain enough factual evidence for 50 questions:
- **Enough facts:** each page has several subsections, code examples or tables. The constraints page alone covers six constraint types (check, not-null, unique, primary key, foreign key, exclusion), and the numeric types and limits pages hold exact sizes, ranges and maximums for numerical questions.
- **Clear evidence:** answers can be tied to a specific paragraph, SQL example or table row, such as the privilege-type table or the numeric type ranges.
- **Useful connections:** pages overlap, so they support multi-document questions. Examples: constraints with index types (unique constraints are enforced with indexes), constraints with partitioning (key rules on partitioned tables), constraints with modifying tables (adding and dropping constraints), privileges with row security, and limits with numeric types.
- **Stable and reproducible:** all pages are text-searchable HTML (no scans), pinned to major version 18 rather than the "current" alias, so content will not shift when a newer version is released.
- **Reuse:** the PostgreSQL License allows copying and redistribution if the copyright notice and license paragraphs are preserved. The legal notice page is stored in the corpus for that reason.
- **Known noise:** saved pages include site navigation and banners (for example, a release announcement banner). These are not part of the evidence text and must not be used as evidence snippets.

## Dataset validation
On Day 3, validate each evidence snippet against its source document.
Do not treat generated questions as verified until the evidence is checked.