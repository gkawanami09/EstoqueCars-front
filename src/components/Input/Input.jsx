import css from "./Input.module.css";

export default function Input({ label, type = "text", img, alt, ...inputProps }) {
    const placeholder =
        type === "password" ? "********" : inputProps.placeholder || "";

    return (
        <div className={css.container}>

            {label && <label className={css.label}>{label}</label>}

            <div className={css.input_box}>


                {img && <img src={img} alt={alt} className={css.icone} />}


                <input
                    className={css.input_field}
                    type={type}
                    placeholder={placeholder}
                    {...inputProps}
                />

            </div>
        </div>
    );
}
