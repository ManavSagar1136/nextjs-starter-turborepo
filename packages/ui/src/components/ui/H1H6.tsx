/* eslint-disable  @typescript-eslint/no-explicit-any */
const H1 = ({ children, ...rest }: any) => {
  return <h1 {...rest}>{children}</h1>;
};

const H2 = ({ children, ...rest }: any) => {
  return <h2 {...rest}>{children}</h2>;
};

export { H1, H2 };
