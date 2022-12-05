import { ChangeEvent, FormEvent, useCallback, useState } from 'react';
import useFetch from '../hooks/useFetch';
import useFunctionRefs from '../hooks/useFunctionRefs';
import { useRouter } from "next/router";

export default function RegisterPage() {
  const { push } = useRouter();
  const { errors, sendRequest } = useFetch("/api/users/signup", "POST");
  const functionRefs = useFunctionRefs({
    sendRequest,
    push
  })
  const [formValues, setFormValues] = useState({
    email: "",
    password: ""
  });

  const handleSetFormValue = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFormValues(values => ({
      ...values,
      [e.target.name]: e.target.value
    }))
  }, []);
  const handleRegisterUser = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    await functionRefs.current.sendRequest(formValues);
    functionRefs.current.push("/");
  }, [formValues, functionRefs]);
  return (
    <form onSubmit={handleRegisterUser}>
      <h1>Sign Up</h1>
      <div className="form-group">
        <label>Email Address</label>
        <input type="text" name='email' value={formValues.email} className="form-control" onChange={handleSetFormValue} />
        {errors?.email && <p className="alert alert-danger">{errors.email}</p>}
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" name='password' value={formValues.password} className="form-control" onChange={handleSetFormValue} />
        {errors?.password && <p className="alert alert-danger">{errors.password}</p>}
      </div>
      <br />
      <button className="btn btn-primary">Submit</button>
    </form>
  )
}