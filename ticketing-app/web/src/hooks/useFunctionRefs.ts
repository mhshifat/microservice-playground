import { useLayoutEffect, useRef } from "react";

export default function useFunctionRefs(initialValues: any) {
  const functionRefs = useRef(initialValues);

  useLayoutEffect(() => {
    functionRefs.current = initialValues;
  }, [initialValues]);

  return functionRefs;
}