import "../landing.css";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  type StatusTone,
} from "@momoi-labs/kiso-react";
import { ShopMark } from "./shop-mark";
import { money, products, shopHref, stockState, type Product } from "./shop-data";

const tone = (product: Product): StatusTone =>
  product.stock === 0 ? "danger" : product.stock <= product.reorder ? "neutral" : "success";
const shelf = products.slice(0, 5);
const picks = [
  { product: products[0], image: "/shop/shuriken.webp", alt: "A four point steel shuriken beside a drawstring pouch", heading: "Thrown, not lost", text: "Six in a pack, because the first throw is practice." },
  { product: products[4], image: "/shop/tabi-boots.webp", alt: "A pair of cream split toe tabi boots with brown soles", heading: "Heard by nobody", text: "Soft soles and a split toe. The floor keeps your secret." },
  { product: products[3], image: "/shop/grappling-hook.webp", alt: "A steel grappling hook with four prongs and a coiled rope", heading: "Up and over", text: "A wall is a short delay when the hook fits in your bag." },
];

export function Storefront() {
  return (
    <div className="intro-page studio-landing">
      <section className="studio-hero studio-wrap" aria-labelledby="storefront-title">
        <div className="studio-copy">
          <div className="brand"><ShopMark /><span className="t-h3">Tabi & Smoke</span></div>
          <p className="t-caps">Ninja supply</p>
          <h1 id="storefront-title" className="t-display" tabIndex={-1}>
            Tools for a quiet job.<br /><em>Delivered without a sound.</em>
          </h1>
          <p className="muted intro-description">
            Shuriken, smoke bombs and split toe boots, packed in a plain box. Your neighbors will think you ordered socks.
          </p>
          <div className="intro-actions">
            <Button variant="primary" onClick={() => document.getElementById("storefront-shelves")?.scrollIntoView({ block: "start" })}>
              Browse the shelves <span aria-hidden="true">↓</span>
            </Button>
            <Button asChild>
              <a href={shopHref("login")}>Sign in</a>
            </Button>
          </div>
        </div>
        <div className="studio-scene">
          <Card>
            <CardHeader><h2>On the shelf this week</h2></CardHeader>
            <CardContent>
              <TableFrame>
                <Table aria-label="Products on the shelf this week">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="num">Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shelf.map(product => (
                      <TableRow key={product.sku}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="num">{money(product.price)}</TableCell>
                        <TableCell><StatusBadge tone={tone(product)}>{stockState(product)}</StatusBadge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableFrame>
            </CardContent>
          </Card>
        </div>
      </section>
      <section id="storefront-shelves" className="intro-contrast studio-demo" aria-labelledby="storefront-shelves-title">
        <div className="studio-wrap studio-section">
          <div className="studio-showcase-heading"><p className="t-caps">Three shelves to start with</p><h2 id="storefront-shelves-title">Everything a careful visitor needs.</h2></div>
          <div className="studio-showcase-grid studio-product-grid">
            {picks.map(({ product, image, alt, heading, text }, index) => (
              <section key={product.sku} aria-labelledby={`storefront-pick-${product.sku}`}>
                <Card className="studio-live-example">
                  <CardContent>
                    <img className="studio-product-media" src={image} alt={alt} width={764} height={764} />
                    <p className="t-caps">{product.sku}</p>
                    <strong>{product.name}</strong>
                    <p className="muted">{product.note}</p>
                    <p className="mono">{money(product.price)}</p>
                  </CardContent>
                </Card>
                <p className="t-caps">0{index + 1} / {product.category}</p><h3 id={`storefront-pick-${product.sku}`}>{heading}</h3><p className="muted">{text}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="intro-cta studio-cta" data-accent="violet" aria-labelledby="storefront-cta-title"><div className="studio-wrap studio-section"><h2 id="storefront-cta-title">Work here? The back office is this way.</h2><div className="studio-actions"><Button asChild variant="ghost"><a href={shopHref("login")}>Staff sign in</a></Button></div></div></section>
      <footer className="studio-wrap studio-footer"><span>© {new Date().getFullYear()} Tabi & Smoke, best-gear.ninja</span><span>Questions: hello@best-gear.ninja</span><span>Shipped at night, in a plain box</span></footer>
    </div>
  );
}
