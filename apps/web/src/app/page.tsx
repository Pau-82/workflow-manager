import { redirect } from 'next/navigation';

/** Home: redirige a la sección principal. */
export default function Home() {
  redirect('/workflows');
}
