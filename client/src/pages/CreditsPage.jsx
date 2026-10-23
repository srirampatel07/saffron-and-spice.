import { Link } from 'react-router-dom';
import { ArrowRight } from '../components/Icons';
import { photoCredits } from '../data/photoCredits';

const scenes = photoCredits.filter((entry) => entry.kind === 'scene');
const dishes = photoCredits.filter((entry) => entry.kind === 'dish');

function CreditTable({ entries, label }) {
  return (
    <div className="credits-table-wrap">
      <table className="credits-table">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            <th scope="col">File</th>
            <th scope="col">Use</th>
            <th scope="col">Photographer</th>
            <th scope="col">Source &amp; licence</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.file}>
              <td>
                <code>{entry.file}</code>
                {entry.note ? <span className="credits-table__note">{entry.note}</span> : null}
              </td>
              <td>{entry.use}</td>
              <td>{entry.photographer}</td>
              <td>
                <div className="credits-table__source">
                  <a href={entry.page} target="_blank" rel="noreferrer">
                    {entry.source}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                  <a
                    className="credits-table__license"
                    href={entry.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {entry.license}
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CreditsPage() {
  return (
    <section className="section container credits-page">
      <header className="credits-head">
        <p className="eyebrow">Photo credits</p>
        <h1 className="display-sm mt-2">The people behind the plates.</h1>
        <p className="lede mt-3">
          Every photograph on this site is stored locally and used under the licence listed below. Thank you to
          the photographers and archivists who make this table feel a little more real.
        </p>
      </header>

      <div className="credits-summary" aria-label="Photography summary">
        <div className="credits-summary__item">
          <strong>32</strong>
          <span>licensed photos</span>
        </div>
        <div className="credits-summary__item">
          <strong>29</strong>
          <span>dish photographs</span>
        </div>
        <div className="credits-summary__item">
          <strong>3</strong>
          <span>illustrated dishes</span>
        </div>
      </div>

      <section className="credits-group" aria-labelledby="credits-scenes-heading">
        <div className="credits-group__head">
          <div>
            <h2 id="credits-scenes-heading">Editorial scenes</h2>
            <p>The hero, kitchen story and dining-room images that set the atmosphere.</p>
          </div>
        </div>
        <CreditTable entries={scenes} label="Editorial photo credits" />
      </section>

      <section className="credits-group" aria-labelledby="credits-dishes-heading">
        <div className="credits-group__head">
          <div>
            <h2 id="credits-dishes-heading">Dish photography</h2>
            <p>Menu, home, cart, checkout and receipt images. Search the menu for a dish to see it in context.</p>
          </div>
        </div>
        <CreditTable entries={dishes} label="Dish photo credits" />
      </section>

      <section className="credits-placeholders" aria-labelledby="credits-placeholders-heading">
        <p className="eyebrow eyebrow--plain">Still illustrated</p>
        <h2 id="credits-placeholders-heading" className="mt-2">
          Three dishes keep their artwork.
        </h2>
        <p className="mt-2">
          We would rather show a clean illustration than a misleading photograph. These three dishes have no
          accurate, appropriately licensed photo in the current library.
        </p>
        <ul>
          <li>
            <strong>Laal Maas</strong> — fiery Rajasthani mutton with mathania chilli.
          </li>
          <li>
            <strong>Peshawari Naan</strong> — naan filled with coconut, sultanas and almonds.
          </li>
          <li>
            <strong>Gulab Jamun Cheesecake</strong> — baked cheesecake with rose syrup and pistachio crumb.
          </li>
        </ul>
      </section>

      <p className="credits-back">
        <Link className="text-link" to="/menu">
          Back to the menu
          <ArrowRight size={16} />
        </Link>
      </p>
    </section>
  );
}
