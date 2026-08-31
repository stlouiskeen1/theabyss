import { notFound } from "next/navigation";
import CategoryView from "./CategoryView";

const SLUGS = ["all", "apparel", "footwear", "accessories", "outerwear"];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string; sub?: string }>;
}) {
  const { slug } = await params;
  if (!SLUGS.includes(slug)) notFound();
  const sp = await searchParams;
  return <CategoryView slug={slug} g={sp.g} sub={sp.sub} />;
}