interface ConfigLayoutProps {
  children: React.ReactNode;
}

export default function ConfigLayout({ children }: ConfigLayoutProps) {
  return <div className="animate-fadeIn">{children}</div>;
}
