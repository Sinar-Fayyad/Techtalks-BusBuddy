import styles from './Button.module.css';

export default function Button({ children, color = 'primary', onClick, type = 'button', disabled }: {
  children: any; color?: 'primary' | 'success' | 'danger'; onClick?: any; type?: 'button' | 'submit'; disabled?: boolean;
}) {
  return (
    <button className={`${styles.btn} ${styles[color]}`} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}
