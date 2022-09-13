import { Down, Right } from '../lib/icons.js';

type ChevyProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  open?: boolean;
  enabled?: boolean;
};

function Chevy({ open, enabled, ...rest }: ChevyProps) {
  const icon =
    enabled && open ? (
      <Down className={`w-5 h-full inline-block`} />
    ) : (
      <Right
        className={`w-5 h-full inline-block ${enabled ? '' : 'text-gray-500'}`}
      />
    );
  return <button {...rest}>{icon}</button>;
}
export default Chevy;
