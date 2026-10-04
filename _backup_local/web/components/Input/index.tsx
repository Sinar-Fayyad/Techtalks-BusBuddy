import styles from './Input.module.css';

export default function Input({ label, error, ...props }: any) {
  return (
    <div className={styles.wrap}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.error : ''}`} {...props} />
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
