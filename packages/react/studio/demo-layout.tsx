import * as React from 'react';

export function Section({id, title, description, className = '', children}: {id?:string; title:string; description?:string; className?:string; children:React.ReactNode}) {
  return <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`react-studio-section ${className}`}><header className="react-studio-section-heading"><h2 id={id ? `${id}-title` : undefined} tabIndex={id ? -1 : undefined}>{title}</h2>{description && <p>{description}</p>}</header><div className="react-studio-demo">{children}</div></section>;
}
