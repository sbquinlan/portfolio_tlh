export default function format_dollas(dollas: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencySign: 'accounting',
  }).format(dollas);
}
