import { Link } from 'react-router-dom'

const FooterWidget = ({ title, links, children }) => {
  return (
    <div className="mb-10">
      <div className="mb-6">
        {title && (
          <h3 className="text-white text-xl font-semibold mb-0 pb-4 border-b-2 border-white/10">
            {title}
          </h3>
        )}
        {children}
      </div>
      {links && (
        <ul className="list-none m-0 p-0">
          {links.map((link) => (
            <li key={link.path} className="mb-3">
              <Link 
                to={link.path}
                className="text-gray-400 no-underline text-sm transition-all inline-block relative pl-0 hover:text-white hover:pl-5"
              >
                <span className="absolute left-0 opacity-0 transition-all text-primary -translate-x-5 group-hover:opacity-100 group-hover:translate-x-0">
                  →
                </span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FooterWidget

