import css from './ButtonLink.module.css'
import { Link } from "react-router-dom"

function Button({buttonTo, buttonNome, variant="preto", className=""}) {
    const variantClass = css[variant] || ""
    const classes = [css.button, variantClass, className].filter(Boolean).join(" ")
    return(
        <Link className={classes} to={buttonTo}>{buttonNome}</Link>
    )
}

export default Button
