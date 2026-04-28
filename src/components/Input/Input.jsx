import {createElement} from "react";
import css from "./Input.module.css";

export default function Input({ label, type = "text", img, alt, as: InputComponent = "input", ...inputProps }) {
    const placeholder =
        type === "password" ? "********" : inputProps.placeholder || "";

    return (
        <div className={css.container}>

            {label && <label className={css.label}>{label}</label>}

            <div className={css.input_box}>


                {img && <img src={img} alt={alt} className={css.icone} />}


                {createElement(InputComponent, {
                    className: css.input_field,
                    type,
                    placeholder,
                    ...inputProps
                })}

            </div>
        </div>
    );
}
