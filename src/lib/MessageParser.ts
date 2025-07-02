interface ParsedContent {
  type: 'text' | 'list' | 'emphasis' | 'code' | 'header' | 'link' | 'nested';
  content: string | ParsedContent[]; // Allow nested content
  level?: number; // for headers or list nesting
  items?: ParsedContent[]; // for lists
  style?: 'bold' | 'italic' | 'underline' | 'code';
  url?: string; // for links
}

interface ParsedMessage {
  originalText: string;
  parsedContent: ParsedContent[];
  hasFormatting: boolean;
}

class MessageParser {
  private static readonly PATTERNS = {
    // Bold text: **text** or __text__
    bold: /\*\*(.*?)\*\*|__(.*?)__/g,
    // Italic text: *text* or _text_
    italic: /\*(.*?)\*|_(.*?)_/g,
    // Inline code: `code`
    inlineCode: /`([^`]+)`/g,
    // Headers: # Header, ## Header, etc.
    headers: /^(#{1,6})\s+(.*)$/gm,
    // Unordered lists: * item, - item
    unorderedList: /^\s*[\*\-]\s+(.*)$/gm,
    // Ordered lists: 1. item, 2. item
    orderedList: /^\s*(\d+)\.\s+(.*)$/gm,
    // Links: [text](url)
    links: /\[([^\]]+)\]\(([^)]+)\)/g,
  };

  static parse(text: string): ParsedMessage {
    const originalText = text;
    let hasFormatting = false;
    const parsedContent: ParsedContent[] = [];

    // Check if text has any formatting
    hasFormatting = this.hasAnyFormatting(text);
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('MessageParser Debug:', {
        text: text.substring(0, 100),
        hasFormatting,
        boldTest: /\*\*(.*?)\*\*/.test(text),
        listTest: /^\s*[\*\-]\s+/.test(text)
      });
    }

    if (!hasFormatting) {
      // Simple text without formatting
      parsedContent.push({
        type: 'text',
        content: text
      });
    } else {
      // Parse formatted content
      const sections = this.parseFormattedText(text);
      parsedContent.push(...sections);
    }

    return {
      originalText,
      parsedContent,
      hasFormatting
    };
  }

  private static hasAnyFormatting(text: string): boolean {
    return (
      this.PATTERNS.bold.test(text) ||
      this.PATTERNS.italic.test(text) ||
      this.PATTERNS.inlineCode.test(text) ||
      this.PATTERNS.headers.test(text) ||
      this.PATTERNS.unorderedList.test(text) ||
      this.PATTERNS.orderedList.test(text) ||
      this.PATTERNS.links.test(text)
    );
  }

  private static parseFormattedText(text: string): ParsedContent[] {
    const sections: ParsedContent[] = [];
    const lines = text.split('\n');
    let listItems: string[] = [];
    let listType: 'ordered' | 'unordered' | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        // Empty line - finalize current list if exists
        if (listItems.length > 0) {
          sections.push(this.createListSection(listItems, listType!));
          listItems = [];
          listType = null;
        }
        continue;
      }

      // Check for headers
      const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headerMatch) {
        // Finalize current list
        if (listItems.length > 0) {
          sections.push(this.createListSection(listItems, listType!));
          listItems = [];
          listType = null;
        }
        
        // Parse header content for nested formatting
        const headerContent = this.parseNestedFormatting(headerMatch[2]);
        sections.push({
          type: 'header',
          content: headerContent.length === 1 && headerContent[0].type === 'text' 
            ? headerMatch[2] 
            : headerContent,
          level: headerMatch[1].length
        });
        continue;
      }

      // Check for unordered list items
      const unorderedMatch = line.match(/^\s*[\*\-]\s+(.*)$/);
      if (unorderedMatch) {
        if (listType !== 'unordered' && listItems.length > 0) {
          sections.push(this.createListSection(listItems, listType!));
          listItems = [];
        }
        listType = 'unordered';
        listItems.push(unorderedMatch[1]);
        continue;
      }

      // Check for ordered list items
      const orderedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        if (listType !== 'ordered' && listItems.length > 0) {
          sections.push(this.createListSection(listItems, listType!));
          listItems = [];
        }
        listType = 'ordered';
        listItems.push(orderedMatch[2]);
        continue;
      }

      // Regular text with possible inline formatting
      if (listItems.length > 0) {
        sections.push(this.createListSection(listItems, listType!));
        listItems = [];
        listType = null;
      }

      const inlineFormatted = this.parseInlineFormatting(line);
      sections.push(...inlineFormatted);
    }

    // Finalize any remaining list
    if (listItems.length > 0) {
      sections.push(this.createListSection(listItems, listType!));
    }

    return sections;
  }

  private static createListSection(items: string[], listType: 'ordered' | 'unordered'): ParsedContent {
    return {
      type: 'list',
      content: listType,
      items: items.map(item => {
        // Parse each list item for nested formatting
        const parsedItem = this.parseNestedFormatting(item);
        if (parsedItem.length === 1 && parsedItem[0].type === 'text') {
          return parsedItem[0];
        } else {
          return {
            type: 'nested',
            content: parsedItem
          };
        }
      })
    };
  }

  private static parseInlineFormatting(text: string): ParsedContent[] {
    return this.parseNestedFormatting(text);
  }

  // New method to handle nested formatting
  private static parseNestedFormatting(text: string, depth: number = 0): ParsedContent[] {
    if (depth > 5) { // Prevent infinite recursion
      return [{ type: 'text', content: text }];
    }

    const sections: ParsedContent[] = [];
    let lastIndex = 0;

    // Find all formatting matches with priority order
    const matches: Array<{
      start: number;
      end: number;
      type: string;
      content: string;
      fullMatch: string;
      priority: number;
      url?: string;
    }> = [];
    
    // Create fresh regex patterns
    const patterns = {
      code: { regex: /`([^`]+)`/g, priority: 1 }, // Highest priority - no nesting inside code
      link: { regex: /\[([^\]]+)\]\(([^)]+)\)/g, priority: 2 },
      bold: { regex: /\*\*((?:[^*]|\*(?!\*))+?)\*\*|__((?:[^_]|_(?!_))+?)__/g, priority: 3 },
      italic: { regex: /\*((?:[^*]|\*\*)+?)\*|_((?:[^_]|__)+?)_/g, priority: 4 }
    };

    // Collect all matches
    Object.entries(patterns).forEach(([type, { regex, priority }]) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (type === 'link') {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            type,
            content: match[1],
            url: match[2],
            fullMatch: match[0],
            priority
          });
        } else {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            type,
            content: match[1] || match[2],
            fullMatch: match[0],
            priority
          });
        }
      }
    });

    // Sort by start position, then by priority (lower number = higher priority)
    matches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.priority - b.priority;
    });

    // Remove overlapping matches, keeping higher priority ones
    const filteredMatches: typeof matches = [];
    for (const match of matches) {
      const hasOverlap = filteredMatches.some(existing => 
        (match.start < existing.end && match.end > existing.start)
      );
      if (!hasOverlap) {
        filteredMatches.push(match);
      }
    }

    // Build sections with nested parsing
    for (const match of filteredMatches) {
      // Add text before this match
      if (match.start > lastIndex) {
        const beforeText = text.substring(lastIndex, match.start);
        if (beforeText.trim()) {
          // Recursively parse the text before this match
          const nestedBefore = this.parseNestedFormatting(beforeText, depth + 1);
          sections.push(...nestedBefore);
        }
      }

      // Add the formatted section
      if (match.type === 'code') {
        // Code blocks don't allow nested formatting
        sections.push({
          type: 'emphasis',
          content: match.content,
          style: 'code'
        });
      } else if (match.type === 'link') {
        // Links can have nested formatting in their text
        const nestedLinkText = this.parseNestedFormatting(match.content, depth + 1);
        sections.push({
          type: 'link',
          content: nestedLinkText,
          url: match.url
        });
      } else {
        // Bold/Italic can have nested formatting
        const nestedContent = this.parseNestedFormatting(match.content, depth + 1);
        if (nestedContent.length === 1 && nestedContent[0].type === 'text') {
          // Simple case: no nested formatting
          sections.push({
            type: 'emphasis',
            content: match.content,
            style: match.type as 'bold' | 'italic'
          });
        } else {
          // Complex case: has nested formatting
          sections.push({
            type: 'nested',
            content: nestedContent,
            style: match.type as 'bold' | 'italic'
          });
        }
      }

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText.trim()) {
        const nestedRemaining = this.parseNestedFormatting(remainingText, depth + 1);
        sections.push(...nestedRemaining);
      }
    }

    // If no formatting was found, return the whole text as one section
    if (sections.length === 0) {
      sections.push({
        type: 'text',
        content: text
      });
    }

    return sections;
  }
}

export default MessageParser;
export type { ParsedContent, ParsedMessage };