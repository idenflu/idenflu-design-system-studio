import * as React from 'react';

export function Section({title, description, className = '', children}: {title:string; description?:string; className?:string; children:React.ReactNode}) {
  return <section className={`react-studio-section ${className}`}><header className="react-studio-section-heading"><h2>{title}</h2>{description && <p>{description}</p>}</header><div className="react-studio-demo">{children}</div></section>;
}
