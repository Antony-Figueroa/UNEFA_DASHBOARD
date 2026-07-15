"""Generate seed-empty.sql and seed-full.sql from the Supabase dump."""
import re

DUMP = r"C:\Users\Server Admin\Downloads\aaaa.sql"
OUT_DIR = r"C:\Users\Server Admin\Documents\GitHub\UNEFA_DASHBOARD\backend\scripts"

with open(DUMP, "r", encoding="utf-8") as f:
    lines = f.readlines()

# ── Find section boundaries ──
sections = {}
for i, line in enumerate(lines):
    s = re.search(r"-- SECCIÓN (\d+):", line)
    if s:
        sections[int(s.group(1))] = i  # 0-indexed

# ── Full seed: copy as-is ──
with open(f"{OUT_DIR}/seed-full.sql", "w", encoding="utf-8") as f:
    f.writelines(lines)
print(f"seed-full.sql: {len(lines)} lines")

# ── Empty seed ──
# Tables considered ESSENTIAL reference data (system config, geography, metadata)
ESSENTIAL_TABLES = {
    "t_academic_config", "t_address_type", "t_config",
    "t_roles", "t_user", "t_user_key", "t_user_roles",
    "t_internship_type", "t_career", "t_career_internship_type",
    "t_internships_period",
    "t_list", "t_value_list",
    "t_landing_config",
    "t_estado", "t_municipio", "t_parroquia",
    "t_permissions",
    "t_tables", "t_columns", "t_operation",
    "t_evaluation_criteria",
    "t_request_types",
    "t_system_institution", "t_system_nucleus",
    "t_password_history",
    "t_persons",
    "t_backups",
    "t_roles_permissions",
    "t_preset_questions",
    "t_email_templates",
    "t_knowledge_base",
}

out_lines = []
in_data_section = False
skip_until_fk = False

for i, line in enumerate(lines):
    stripped = line.strip()

    # Detect section boundaries
    if "-- SECCIÓN 4: DATOS" in line:
        in_data_section = True
        out_lines.append(line)
        continue

    if "-- SECCIÓN 5: CONSTRAINTS" in line:
        in_data_section = False
        out_lines.append(line)
        continue

    # Outside data section → keep everything
    if not in_data_section:
        out_lines.append(line)
        continue

    # Inside data section: only keep essential table inserts
    # Check if this is an INSERT line for an essential table
    insert_match = re.match(r'INSERT INTO\s+(?:public\.)?(?:")?(\w+)(?:")?\s', stripped)
    if insert_match:
        table_name = insert_match.group(1)
        if table_name in ESSENTIAL_TABLES:
            out_lines.append(line)
        # else: skip (test data)
    elif stripped.startswith("--"):
        # Keep section comments like "-- Tabla: t_something"
        out_lines.append(line)
    elif stripped == "":
        out_lines.append(line)
    # else: skip other data section lines (INSERT continuations, etc.)

# Write empty seed
with open(f"{OUT_DIR}/seed-empty.sql", "w", encoding="utf-8") as f:
    f.writelines(out_lines)
print(f"seed-empty.sql: {len(out_lines)} lines (was {len(lines)}, removed {len(lines) - len(out_lines)})")

# Print which tables were kept
kept = set()
for line in out_lines:
    m = re.match(r'INSERT INTO\s+(?:public\.)?(?:")?(\w+)(?:")?\s', line.strip())
    if m:
        kept.add(m.group(1))
print(f"\nTables with data in empty seed ({len(kept)}): {sorted(kept)}")
