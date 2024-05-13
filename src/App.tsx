import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {
  createBrowserRouter,
  Link,
  RouterProvider,
  useLocation,
  useNavigate,
  useParams,
  useRouteError,
} from "react-router-dom";
import './App.css'

interface ResultData {
  id: number
  title: string
  image_id: number
  thumbnail: Thumbnail
  category_titles: string[]
  artist_display: string
  main_reference_number: string
  dimensions: string
}

interface Thumbnail {
  lqip: string
}

const api = "https://api.artic.edu/api/v1/artworks";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "detail/:id",
    element: <DetailsPage />,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}

function HomePage() {
  const itemsPerPage = 10;
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResultData[]>([]);
  const [data, setData] = useState<ResultData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const location = useLocation();
  const state = location.state;

  const fetchData = async () => {
    let response: any;
    try {
      if (query == '') {
        response = await fetch(`${api}?page=${currentPage}&limit=${itemsPerPage}`);
      } else {
        response = await fetch(`${api}/search?q=${query}&page=${currentPage}&limit=${itemsPerPage}`);
      }
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setTotalPages(result.pagination.total);
      if (query != '') {
        setResult(result.data);
      }
      setData(result.data);
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(result.data.flatMap((data:any) => data.category_titles)));
      setCategories(['All', ...uniqueCategories]); // Add 'All' option
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // should share this with DetailPage
  const LoadingIndicator = () => {
    return (
      <>
        <h1>Loading...</h1>
      </>
    )
  }
  // should share this with DetailPage
  const Header = () => {
    return (
      <>
        <div>
          <a href="https://vitejs.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        {state && (
          <>
            <h5>Previous Route: <a href={`/detail/${state}`}>/detail/{state}</a></h5>
          </>
        )}
      </>
    )
  }
// should share this with DetailPage
  const ErrorBanner = () => {
    return (
      <>
      {error && (
        <div className="error">{error}</div>
      )}
      </>
    )
  }

  const Pagination = () => {
    return (
      <div>
        <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
      </div>
    )
  }

  const handlePrevPage = () => {
    handleCategoryChange("All"); 
    setCurrentPage(currentPage => currentPage - 1);
  };

  const handleNextPage = () => {
    handleCategoryChange("All");
    setCurrentPage(currentPage => currentPage + 1);
  };

  const Search = () => {
    return (
      <>
        <button onClick={handleClearSearch}>Clear Search</button>
        <input autoFocus type="text" placeholder='Search artwork..' value={query} onChange={handleSearch} />
      </>
    )
  }

  const handleSearch = async (event: any) => {
    const query = event.target.value;
    setCurrentPage(1);
    setQuery(query);
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks/search?q=${query}?page=${currentPage}`);
      if(!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const result = await response.json();
      setResult(result.data);
      setTotalPages(result.pagination.total);
    } catch (error: any) {
      setError(error.message);
    }
  }

  const handleClearSearch = () => {
    setQuery('');
    setCurrentPage(1);
    setResult([]);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      // resetting filter prevents pagination issue,
      // the filter is only suppose to apply to search result as per requirement
      setResult([]);
      setData(data);
    } else {
      const filtered = data.filter(item => item.category_titles.includes(category));
      setResult(filtered);
    }
  };

  const CategoryFilter = () => {
    return (
      <div>
      <label htmlFor="category">Category filter:</label>
      <select id="category" value={selectedCategory} onChange={e => handleCategoryChange(e.target.value)}>
        {categories.map((category: any) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
    </div>
    )
  }

  return (
    <>
      {isLoading ? <LoadingIndicator /> :
      <>
        <Header />
        <ErrorBanner />
        <Search />
        <Pagination></Pagination>
        <CategoryFilter />
        {(result && result.length > 0) && (
          <>
            {result.map((item) => (
              <Link key={item.id} to={`detail/${item.id}`}>
              <div className="data-container">
                <img className="data-image" width={200} height={200} src={`https://www.artic.edu/iiif/2/${item.image_id}/full/200,/0/default.jpg`} />
                <div className="data-title">{item.title}</div>
              </div>
              </Link>
            ))}
          </>
        )}
        {(data && result.length == 0) && (
          <>
            {data.map((item) => (
              <Link key={item.id} to={`detail/${item.id}`}>
              <div className="data-container">
                <img className="data-image" width={200} height={200} src={`https://www.artic.edu/iiif/2/${item.image_id}/full/200,/0/default.jpg`} />
                <div className="data-title">{item.title}</div>
              </div>
              </Link>
            ))}
          </>
        )}
        <Pagination />
      </>
    }
    </>
  )
}

// could be imported to declutter this monolith file
function DetailsPage() {
  const {id} = useParams<{id: string}>();
  const [data, setData] = useState<ResultData | null>(null);
  // could add better error handling using react router ErrorBoundary
  const [error, setError] = useState(null);
  // could add loading indicator on DetailPage
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);
  const [errors, setErrors] = useState({comment: ''});

  const fetchData = async () => {
    try {
      const response = await fetch(`${api}/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result.data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let formValid = true;
    const newErrors = {comment: '' };

    // validate
    if (!comment.trim()) {
      newErrors.comment = 'Comment is required';
      formValid = false;
    }

    if (formValid) {
      setErrors(() => ({comment: ''}));
      console.log('Form submitted:', { comment });
      // Clear form fields
      setComment('');
      setComments(() => [...comments, comment]);
    } else {
      setErrors(newErrors);
    }
  }

  return (
    <>
      <h1>Details page</h1>
      <Link to="/" state={id}><button>Back</button></Link>
      <ul>
      {data && (
        <>
          <li>title: {data.title}</li>
          <li>artist_display: {data.artist_display}</li>
          <li>main_reference_number: {data.main_reference_number}</li>
          <li>thumbnail: <img width={100} height={100} src={data.thumbnail.lqip} /></li>
          <li>dimensions: {data.dimensions}</li>
        </>
      )}
      </ul>
      {comments && (
        <>
          <h3>Comments:</h3>
          <ul>
            {comments && (
              comments.map((comment: string) => (
                <li key={comment}>{comment}</li>
              ))
            )}
          </ul>
        </>
      )}
      <form onSubmit={handleCommentSubmit}>
        <h4>Comments form:</h4>
        <div>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {errors.comment && <p className="error">{errors.comment}</p>}
        </div>
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default App
