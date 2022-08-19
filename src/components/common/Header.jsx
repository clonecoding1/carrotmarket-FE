import styled from "styled-components";

const Header = (props) => {
  return (
    <StHeader>
      {props.children}
    </StHeader>
  )
}

export default Header

const StHeader = styled.footer`
  height: 100px;
  background-color: blue;
`