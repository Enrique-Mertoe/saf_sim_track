"use client"
import React from 'react';
import MessageParser, {ParsedContent} from '@/lib/MessageParser';

interface MessageRendererProps {
  content: string;
  className?: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({ content, className = '' }) => {
  const parsed = MessageParser.parse(content);
  
  // Debug info in development
  if (process.env.NODE_ENV === 'development' && parsed.hasFormatting) {
    console.log('Rendered message:', {
      original: content,
      parsed: parsed.parsedContent,
      hasFormatting: parsed.hasFormatting
    });
  }

  if (!parsed.hasFormatting) {
    return <span className={className}>{content}</span>;
  }

  // Recursive function to render nested content
  const renderContent = (sections: ParsedContent[], keyPrefix = ''): React.ReactNode[] => {
    return sections.map((section, index) => {
      const key = `${keyPrefix}section-${index}`;
      
      switch (section.type) {
        case 'text':
          return <span key={key}>{section.content as string}</span>;
        
        case 'header':
          const level = Math.min(section.level || 1, 6);
          //@ts-ignore
          const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
          return (
              //@ts-ignore
            <HeaderTag key={key} className="font-semibold my-1">
              {Array.isArray(section.content) 
                ? renderContent(section.content, `${key}-`) 
                : section.content as string}
            </HeaderTag>
          );
        
        case 'list':
          const ListTag = section.content === 'ordered' ? 'ol' : 'ul';
          const listClass = section.content === 'ordered' 
            ? 'list-decimal list-inside pl-4' 
            : 'list-disc list-inside pl-4';
          return (
            <ListTag key={key} className={`${listClass} my-1`}>
              {section.items?.map((item, itemIndex) => (
                <li key={`${key}-item-${itemIndex}`} className="mb-0.5">
                  {item.type === 'nested' && Array.isArray(item.content)
                    ? renderContent(item.content as ParsedContent[], `${key}-item-${itemIndex}-`)
                    : item.content as string}
                </li>
              ))}
            </ListTag>
          );
        
        case 'emphasis':
          const emphasisContent = Array.isArray(section.content) 
            ? renderContent(section.content, `${key}-`) 
            : section.content as string;
            
          switch (section.style) {
            case 'bold':
              return (
                <strong key={key} className="font-bold">
                  {emphasisContent}
                </strong>
              );
            case 'italic':
              return (
                <em key={key} className="italic">
                  {emphasisContent}
                </em>
              );
            case 'code':
              return (
                <code key={key} className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                  {emphasisContent}
                </code>
              );
            default:
              return <span key={key}>{emphasisContent}</span>;
          }
        
        case 'nested':
          const NestedWrapper = section.style === 'bold' ? 'strong' : 
                               section.style === 'italic' ? 'em' : 'span';
          const nestedClass = section.style === 'bold' ? 'font-bold' :
                             section.style === 'italic' ? 'italic' : '';
          
          return React.createElement(NestedWrapper, {
            key,
            className: nestedClass
          }, Array.isArray(section.content) 
            ? renderContent(section.content, `${key}-`)
            : section.content as string);
        
        case 'link':
          const linkContent = Array.isArray(section.content) 
            ? renderContent(section.content, `${key}-`) 
            : section.content as string;
            
          return (
            <a 
              key={key} 
              href={section.url || "#"} 
              className="text-green-600 underline hover:text-green-800"
              onClick={(e) => e.preventDefault()}
            >
              {linkContent}
            </a>
          );
        
        default:
          return <span key={key}>{section.content as string}</span>;
      }
    });
  };

  return (
    <div className={`${className} formatted-message`}>
      {renderContent(parsed.parsedContent)}
    </div>
  );
};

export default MessageRenderer;