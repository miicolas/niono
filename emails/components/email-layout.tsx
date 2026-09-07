import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
} from "@react-email/components";
import type { ReactNode } from "react";
import { PROJECT } from "@/constants/project";

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
  margin: 0,
  padding: "32px 16px",
};
const container = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "520px",
  padding: "32px",
};
const brand = { color: "#18181b", fontSize: "18px", fontWeight: 700 };
const footer = { color: "#71717a", fontSize: "12px", marginTop: "24px" };

/** Gabarit commun des emails : en-tête de marque, contenu, pied discret. */
export function EmailLayout({
  previewText,
  children,
}: {
  previewText: string;
  children: ReactNode;
}) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brand}>{PROJECT.NAME}</Section>
          <Section>{children}</Section>
          <Section style={footer}>
            Un espace de travail libre et indépendant.
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
