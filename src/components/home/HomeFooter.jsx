import Link from 'next/link';
import {
  BRAND_NAME,
  HOME_FOOTER_DISCLAIMER,
  HOME_FOOTER_LEGAL_BIBLIOGRAPHY,
  HOME_FOOTER_LEGAL_GDPR,
  HOME_FOOTER_LEGAL_TITLE,
  HOME_FOOTER_PRODUCT_ADVISOR,
  HOME_FOOTER_PRODUCT_BIASES,
  HOME_FOOTER_PRODUCT_MAP,
  HOME_FOOTER_PRODUCT_PGSI,
  HOME_FOOTER_PRODUCT_TITLE,
  HOME_FOOTER_RESOURCES_HELP,
  HOME_FOOTER_RESOURCES_KETHEA,
  HOME_FOOTER_RESOURCES_TITLE,
  HOME_FOOTER_TAGLINE,
  HOME_FOOTER_THESIS,
} from '@/lib/strings';

export default function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="home-footer">
      <div className="home-container home-footer__grid">
        <div className="home-footer__brand">
          <Link href="/" className="home-footer__logo">
            {BRAND_NAME}
          </Link>
          <p className="home-footer__tagline">{HOME_FOOTER_TAGLINE}</p>
        </div>

        <div className="home-footer__col">
          <h3 className="home-footer__heading">{HOME_FOOTER_PRODUCT_TITLE}</h3>
          <ul>
            <li>
              <Link href="/advisor">{HOME_FOOTER_PRODUCT_ADVISOR}</Link>
            </li>
            <li>
              <Link href="/screener">{HOME_FOOTER_PRODUCT_PGSI}</Link>
            </li>
            <li>
              <Link href="/biases">{HOME_FOOTER_PRODUCT_BIASES}</Link>
            </li>
            <li>
              <Link href="/#world-map">{HOME_FOOTER_PRODUCT_MAP}</Link>
            </li>
          </ul>
        </div>

        <div className="home-footer__col">
          <h3 className="home-footer__heading">{HOME_FOOTER_RESOURCES_TITLE}</h3>
          <ul>
            <li>
              <a href="https://www.kethea.gr" target="_blank" rel="noopener noreferrer">
                {HOME_FOOTER_RESOURCES_KETHEA}
              </a>
            </li>
            <li>
              <Link href="/bibliography">{HOME_FOOTER_RESOURCES_HELP}</Link>
            </li>
          </ul>
        </div>

        <div className="home-footer__col">
          <h3 className="home-footer__heading">{HOME_FOOTER_LEGAL_TITLE}</h3>
          <ul>
            <li>
              <Link href="/bibliography">{HOME_FOOTER_LEGAL_BIBLIOGRAPHY}</Link>
            </li>
            <li>
              <span>{HOME_FOOTER_LEGAL_GDPR}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="home-container home-footer__bottom">
        <p className="home-footer__disclaimer">{HOME_FOOTER_DISCLAIMER}</p>
        <p className="home-footer__thesis">{HOME_FOOTER_THESIS}</p>
        <p className="home-footer__copy">
          © {year} {BRAND_NAME}. Εκπαιδευτικό demo — όχι για κλινική χρήση.
        </p>
      </div>
    </footer>
  );
}
