interface Book {
  id: number;
  title: string;
  author: string;
  year: number;
  genre: string;
}

const books: Book[] = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    year: 1960,
    genre: "Fiction",
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    year: 1949,
    genre: "Dystopian",
  },
  {
    id: 3,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    year: 1925,
    genre: "Classic",
  },
  {
    id: 4,
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    year: 1967,
    genre: "Magical Realism",
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    year: 1951,
    genre: "Fiction",
  },
];

export const getBooks = () => {
  return books;
};

export const getBookById = (id: number) => {
  return books.find((book) => book.id === id);
};
