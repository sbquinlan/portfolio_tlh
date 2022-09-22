import { PropsWithChildren } from "react";

type TProps = {
  title: string,
  header?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>;
function SectionCard({ className, title, header, children, ... rest }: PropsWithChildren<TProps>) {
  return (
    <div className={`flex flex-col ${className}`} {... rest}>
      <div className="flex-shrink-0 flex flex-row items-center py-2 px-4">
        <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
        {header}
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
export default SectionCard;