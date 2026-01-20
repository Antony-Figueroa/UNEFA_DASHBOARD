export type MatriculaParams = {
  careerAbbreviation?: string | null;
  regime?: string | null;
  semester?: number | string | null;
  section?: number | string | null;
};

export function generateMatricula({
  careerAbbreviation,
  regime,
  semester,
  section,
}: MatriculaParams): string {
  const abbr = (careerAbbreviation || "GEN").toUpperCase();

  const turno = (() => {
    const r = (regime || "").toUpperCase();
    if (r === "DIURNO") return "D1";
    if (r === "NOCTURNO") return "N2";
    if (r === "SABATINO") return "S3";
    return "D1";
  })();

  const sem = String(semester ?? "").padStart(2, "0");
  const sec = String(section ?? "").padStart(3, "0");

  return `${abbr}-${sem}-${sec}-${turno}`.toUpperCase();
}

