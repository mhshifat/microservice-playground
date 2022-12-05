import axios from "axios";
import { useState } from "react";

export default function useFetch(url: string, method: "GET" | "POST" | "PUT" | "DELETE", options?: { params: any, headers: any }) {
  const [errors, setErrors] = useState<any>({});

  const sendRequest = async (body: any) => {
    try {
      const { data } = await axios({
        url,
        method,
        data: body,
        ...options?.params?{params: options?.params}:{},
        ...options?.headers?{headers: options?.headers}:{},
      });
      return data.result;
    } catch (err: any) {
      err.response.data?.errors?.forEach((err: any) => setErrors((values: any) => ({...values, [err.path]: err.message})));
      return Promise.reject();
    }
  }

  return { errors, sendRequest };
}