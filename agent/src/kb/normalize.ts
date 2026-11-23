
export function normalizeVi(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function foldVi(text: string): string {
  return normalizeVi(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export function tokenize(text: string): string[] {
  return normalizeVi(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 0);
}

export function queryTerms(query: string): { words: string[]; bigrams: string[] } {
  const words = tokenize(query);
  const bigrams: string[] = [];
  for (let i = 0; i + 1 < words.length; i++) bigrams.push(`${words[i]} ${words[i + 1]}`);
  return { words, bigrams };
}
