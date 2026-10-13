# TenderLens Data Directory

This directory stores datasets, sample procurement files, and test inputs:

- **Sample Tenders**: Sample public procurement tenders and notice documents for PDF extraction testing.
- **OCDS (Open Contracting Data Standard)**: Sample JSON exports for benchmarking entity resolution and collusion algorithms.
- **Model Checkpoints / Weights**: Local test data for AI anomaly models and TF-IDF test matrices.

> **Note**: Sensitive production data and confidential tender submissions must never be committed to source control. Local uploads are routed to `server/uploads/` and ignored by git.
