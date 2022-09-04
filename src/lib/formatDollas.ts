export default function formatDollas(dollas: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    currencySign: "accounting" 
  }).format(dollas);
}