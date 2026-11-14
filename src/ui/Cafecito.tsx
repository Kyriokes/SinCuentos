const KOFI_URL = 'https://ko-fi.com/R5R21UFJBX';

/** Link para apoyar el proyecto. La taza es propia, dibujada con trazo de cal. */
export function Cafecito() {
  return (
    <a className="cafecito" href={KOFI_URL} target="_blank" rel="noreferrer">
      <svg viewBox="0 0 28 24" width={28} height={24} aria-hidden="true">
        <path className="cafecito-humo" d="M9 5C9 3.4 11 3.4 11 1.8M15 5C15 3.4 17 3.4 17 1.8" />
        <path d="M4 9H20V15.5A5.5 5.5 0 0 1 14.5 21H9.5A5.5 5.5 0 0 1 4 15.5Z" />
        <path d="M20 11H21.8A3 3 0 0 1 21.8 17H19.6" />
      </svg>
      <span>Invitame un cafecito</span>
    </a>
  );
}
