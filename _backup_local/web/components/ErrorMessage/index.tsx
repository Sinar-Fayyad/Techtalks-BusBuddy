import styles from './ErrorMessage.module.css';

export default function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p role="alert" className={styles.error}>{message}</p>;
}
