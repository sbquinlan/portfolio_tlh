export function min_edit_distance(
  a: string,
  b: string,
  min: number = 2
): number {
  a = a.toLocaleUpperCase();
  b = b.toLocaleUpperCase();
  const table = new Array(a.length + 1)
    .fill(0)
    .map((_) => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) {
    for (let j = 0; j <= b.length; j++) {
      table[i][j] =
        i == 0 || j == 0
          ? i + j
          : a[i] == b[j]
          ? table[i - 1][j - 1]
          : 1 + Math.min(table[i - 1][j], table[i][j - 1], table[i - 1][j - 1]);
    }
  }
  return table[a.length][b.length];
}

export function score(search: string, option: string): number {
  if (option.startsWith(search)) return 0;
  if (~option.indexOf(search)) return 1;
  return min_edit_distance(search, option) + 1;
}

export function rank_options<TOption>(
  search: string,
  all: TOption[],
  existing: string[],
  value: (t: TOption) => string
) {
  if (search.length == 0) return [];
  return (
    all
      // keep it unique
      .filter((t) => !~existing.indexOf(value(t)))
      // score
      .map<[TOption, number]>((t) => [t, score(search, value(t))])
      // filter
      .filter(([_, s]) => s < 3)
      // sort
      .sort(([_, a], [__, b]) => a - b)
      // unscore
      .map(([t, _]) => t)
  );
}
