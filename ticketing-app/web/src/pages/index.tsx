function Home({ authUser }: any) {
  return (
    <h1>You are {authUser?.email ? "" : "not"} signed in</h1>
  )
}

export default Home;