import { Navigate, Route, Routes } from "react-router-dom";
import Example from "../pages/Example";
import Login from "../pages/Login";
import Write from "../pages/Write";
import Mypage from "../pages/Mypage";
import Detail from "../pages/Detail";

const Router = () => {
  // 나중에 로그인 유무에 따른 alert를 여기서 전부 처리하기
  return (
    <Routes>
      <Route path="/" element={<Example />} />
      <Route path="/login" element={<Login />} />
      <Route path="/write" element={<Write />} />
      <Route path="/mypage" element={<Mypage />} />
      <Route path="/detail/:postId" element={<Detail />} />
      <Route path="/*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default Router;
