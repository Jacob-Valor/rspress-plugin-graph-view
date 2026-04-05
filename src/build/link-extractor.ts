import { MDASTFromMarkdown, unistVisit } from "rspress-plugin-devkit";

export function extractMarkdownLinks(source: string): string[] {
  const tree = MDASTFromMarkdown(source);
  const links: string[] = [];

  unistVisit(tree, "link", (node) => {
    const target = cleanLinkTarget(node.url);
    if (isInternalDocLink(target)) {
      links.push(target);
    }
  });

  return links;
}

export function extractDisplayTitle(source: string): string | undefined {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch?.[1]) {
    const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m);
    if (titleMatch?.[1]) {
      return titleMatch[1].trim().replace(/^['"]|['"]$/g, "");
    }
  }

  const headingMatch = source.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }

  return undefined;
}

function cleanLinkTarget(rawLink: string): string {
  const hashIndex = rawLink.indexOf("#");
  const queryIndex = rawLink.indexOf("?");
  let end = rawLink.length;

  if (hashIndex !== -1 && hashIndex < end) {
    end = hashIndex;
  }

  if (queryIndex !== -1 && queryIndex < end) {
    end = queryIndex;
  }

  const cleaned = rawLink.slice(0, end).trim();
  if (cleaned.startsWith("<") && cleaned.endsWith(">")) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

function isInternalDocLink(link: string): boolean {
  return Boolean(
    link &&
      !link.startsWith("#") &&
      !link.startsWith("http://") &&
      !link.startsWith("https://") &&
      !link.startsWith("mailto:") &&
      !link.startsWith("tel:"),
  );
}
