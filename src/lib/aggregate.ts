export function sum_entries<TPivot extends Record<string, number>>(
  pivot: TPivot,
  other?: Partial<TPivot>
): TPivot {
  return Object.fromEntries(
    Object.entries(pivot).map(([key, value]) => [
      key,
      other ? (other[key] ?? 0) + value : value,
    ])
  ) as TPivot;
}

export function group_by<TElm, TResult>(
  get_key: (elm: TElm) => string,
  select: (prev: TResult | undefined, curr: TElm) => TResult
) {
  return (acc: Record<string, TResult>, curr: TElm) => {
    const key = get_key(curr);
    acc[key] = select(acc[key], curr);
    return acc;
  };
}

export function sum<TElm>(
  things: Array<TElm>,
  get_val: (e: TElm) => number
): number {
  return things.reduce((sum, thing) => sum + get_val(thing), 0);
}
