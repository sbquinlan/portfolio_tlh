import { PropsWithChildren } from 'react';

type TProps = {
  title: string;
  controls: React.ReactNode | undefined,
} & React.HTMLAttributes<HTMLDivElement>;
function SectionCard({
  className,
  title,
  controls,
  children,
  ...rest
}: PropsWithChildren<TProps>) {
  return (
    <div {...rest} className="w-full">
      <div className="w-full bg-gray-200 truncate text-lg font-bold py-2 px-4 mb-4">
        <h1>{title}</h1>
      </div>
      <div className="lg:grid lg:grid-cols-3 lg:gap-4 px-4">
        <div>{controls}</div>
        <div className="lg:col-span-2">{children}</div>
      </div>
    </div>
  );
}
export default SectionCard;
