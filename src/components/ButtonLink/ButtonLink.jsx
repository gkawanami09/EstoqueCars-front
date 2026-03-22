import css from './ButtonLink.module.css'
import { Link } from "react-router-dom"

function Button({buttonTo, buttonNome}) {
    return(
        <Link className={css.button} to={buttonTo}>{buttonNome}</Link>
    )
}

export default Button