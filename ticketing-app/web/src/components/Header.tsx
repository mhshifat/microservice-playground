import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback } from "react";
import useFetch from "../hooks/useFetch";
import useFunctionRefs from "../hooks/useFunctionRefs";

export default function Header({ authUser }: any) {
  const { push } = useRouter();
  const { sendRequest } = useFetch("/api/users/signout", "DELETE");
  const fuctionRefs = useFunctionRefs({
    sendRequest,
    push
  })
  const handleSignOut = useCallback(async () => {
    await fuctionRefs.current.sendRequest({});
    fuctionRefs.current.push("/");
  }, [fuctionRefs])

  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" href="/">GitTix</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* <li className="nav-item">
              <Link className="nav-link active" aria-current="page" href="/">Home</Link>
            </li> */}
          </ul>
          <ul className="d-flex navbar-nav">
            <li className="nav-item d-flex">
              {authUser ? (
                <Link className="nav-link" aria-current="page" href="/" onClick={(e) => {
                  e.preventDefault();
                  handleSignOut()
                }}>Sign Out</Link>
                ) : (
                <>
                  <Link className="nav-link" aria-current="page" href="/login">Sign In</Link>
                  <Link className="nav-link" aria-current="page" href="/register">Sign Up</Link>
                </>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}