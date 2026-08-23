import { useBookContainer } from "./Book.container.hook";
import { BookComponent } from "./Book.component";

export function BookContainer() {
  const { registerBook } = useBookContainer();
  return <BookComponent registerBook={registerBook} />;
}
