import React, { useCallback, useState } from "react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import Carousel from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ImCancelCircle } from "react-icons/im";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useSelector } from "react-redux";

import { storage } from "../utils/firebase/firebase";
import { ref, deleteObject } from "firebase/storage";

import { deletePost, getPostOne } from "../api/postAPI";
import { getTimeString } from "../utils/timeString";
import { addnRemoveLike } from "../api/likeAPI";
import { errorAlert, likeAlert, passwordCheckAlert, successAlert } from "../utils/swal";

const Detail = () => {
  const nav = useNavigate();
  const postId = useParams().postId;
  const [post, setPost] = useState({});
  const [likeToggle, setLikeToggle] = useState(false);

  useEffect(() => {
    getPostOne(postId).then((answer) => {
      if (answer.result) {
        const postData = {
          ...answer.post,
          img: answer.post.img.split(","),
          createdAt: getTimeString(new Date(answer.post.createdAt - 1000 * 60 * 60 * 9)),
        };
        setPost(postData);
        setLikeToggle(postData.like);
      }
    });
  }, []);

  // drag, click 이벤트 분리
  const [dragging, setDragging] = useState(false);
  const [originImg, setOriginImg] = useState(null);
  // 레퍼를 가져와서 쓴거기에 useCallback에 대한 자세한 이해는 안됨
  // 불필요한 렌더링 막기위해 사용한 것으로 추정
  const handleBeforeChange = useCallback(() => {
    setDragging(true);
  }, [setDragging]);

  const handleAfterChange = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  const imgClickHandle = useCallback(
    (e) => {
      if (dragging) {
        e.stopPropagation();
        return;
      }
      setOriginImg(process.env.REACT_APP_IMGURL + e.target.dataset["url"]);
    },
    [dragging]
  );

  const carouselOpt = {
    dots: true,
    arrows: false,
    infinite: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    speed: 500,
    draggable: true,
    beforeChange: handleBeforeChange,
    afterChange: handleAfterChange,
  };

  const { isLogin } = useSelector((state) => state.tokenSlice);
  const likeHandler = async () => {
    if (isLogin) {
      const answer = await addnRemoveLike(postId);
      if (answer.result) {
        likeAlert(answer.message);
        setLikeToggle(!likeToggle);
      }
    } else {
      alert("로그인 후 이용해주세요");
    }
  };

  const userId = useSelector((state) => state.tokenSlice.user.userId);
  const deleteHandler = async () => {
    const result = await passwordCheckAlert("삭제");
    if (result.isConfirmed) {
      const answer = await deletePost(postId, result.value);
      if (answer.result) {
        post.img.forEach((img) => {
          const fileName = img.split("?")[0];
          const realName = fileName.replace("%2F", "/");
          const deleteFileRef = ref(storage, realName);
          deleteObject(deleteFileRef);
        });
        const result = await successAlert(answer.message);
        if (result.isConfirmed || result.isDismissed) nav("/");
      } else {
        await errorAlert(answer.message);
      }
    }
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <ImgArea>
          <CustomCarouse {...carouselOpt}>
            {post.img &&
              post.img.map((img) => {
                return (
                  <PostImg
                    data-url={img}
                    onClick={imgClickHandle}
                    bgsize={post.img && post.img[0].includes("post-img") ? "cover" : "contain"}
                    key={img}
                  />
                );
              })}
          </CustomCarouse>
        </ImgArea>
        <InfoArea>
          <UserInfo className="fcc">
            <div className="fcc">
              <img src={post.profile ? (post.profile.includes("user-img") ? process.env.REACT_APP_IMGURL + post.profile : post.profile) : null} />
              <div>
                <p>{post.nickname}</p>
                <p>{post.location}</p>
              </div>
            </div>
            {post.userId === userId ? (
              <Btn onClick={deleteHandler} style={{ width: "6rem", marginRight: "2rem" }}>
                삭제
              </Btn>
            ) : null}
          </UserInfo>
          <PostInfo>
            <div>{post.title}</div>
            <div>{post.createdAt}</div>
            <div>{post.content}</div>
          </PostInfo>
        </InfoArea>
        <ImgModal className="fcc" visible={originImg ? true : false}>
          <CancelBtn onClick={() => setOriginImg(null)}>
            <ImCancelCircle />
          </CancelBtn>
          <img src={originImg} />
        </ImgModal>
        <div style={{ paddingBottome: "20px" }}>
          <ChatModal className="fcc">
            <div className="fcc">
              <p className="fcc" onClick={likeHandler}>
                {likeToggle ? <AiFillHeart color="rgb(255, 138, 61)" /> : <AiOutlineHeart />}
              </p>
              <p>{post.price}원</p>
            </div>
            <Btn
              onClick={() => {
                nav("/chatlist");
              }}
            >
              채팅하기
            </Btn>
          </ChatModal>
        </div>
      </div>
    </>
  );
};

const ImgArea = styled.div`
  width: 100%;
  background-color: white;
`;

const CustomCarouse = styled(Carousel)`
  .slick-dots {
    bottom: 1rem;
  }
  .slick-dots li.slick-active button::before {
    color: white !important;
  }
`;

const PostImg = styled.div`
  cursor: pointer;
  width: 100%;
  height: 35rem;
  border-radius: 0.5rem;
  box-shadow: 0 0.3rem 0.3rem -0.3rem;
  background: url(${(props) => (props["data-url"] ? process.env.REACT_APP_IMGURL + props["data-url"] : null)});
  background-size: ${(props) => props.bgsize};
  background-position: center;
  background-repeat: no-repeat;
  background-color: white;
`;

const ImgModal = styled.div`
  position: fixed;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  z-index: ${(props) => (props.visible ? 10000 : -1)};
  top: ${(props) => (props.visible ? 0 : "8rem")};
  max-width: 60rem;
  width: 100%;
  height: 100%;
  transition-duration: 0.6s;
  background: black;
  & > img {
    width: 100%;
    -webkit-user-drag: none;
  }
`;

const CancelBtn = styled.div`
  cursor: pointer;
  border-radius: 50%;
  position: absolute;
  font-size: 5rem;
  color: white;
  top: 1rem;
  left: 1rem;
`;

const InfoArea = styled.div`
  padding: 2rem;
  flex: 1;
`;

const UserInfo = styled.div`
  justify-content: space-between !important;
  padding-bottom: 2rem;
  border-bottom: 0.1rem solid rgba(0, 0, 0, 0.1);
  div > img {
    width: 5rem;
    height: 5rem;
    border: 0.1rem solid #dadada;
    border-radius: 50%;
  }
  div > div {
    margin-left: 1rem;
    font-size: 1.2rem;
  }
  div > div > p:first-child {
    font-weight: bold;
    font-size: 1.5rem;
  }
`;

const PostInfo = styled.div`
  padding: 2rem 0;
  font-size: 1.5rem;
  * {
    margin-bottom: 0.5rem;
  }
  div:nth-child(1) {
    font-size: 2rem;
    font-weight: bold;
  }
  div:nth-child(2) {
    color: gray;
  }
  div:nth-child(3) {
    padding: 1rem 0;
    white-space: pre-wrap;
  }
`;

const ChatModal = styled.div`
  justify-content: space-between !important;
  width: 100%;
  padding: 1rem 2rem 1rem 1rem;
  bottom: 10rem;
  background: rgba(255, 138, 61, 0.5);
  border-radius: 25px;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 2rem;

  div > p {
    padding: 0 1rem;
  }
  div > p:first-child {
    cursor: pointer;
    font-size: 3rem;
    width: 5rem;
    height: 5rem;
    border-right: 0.2rem solid rgba(0, 0, 0, 0.1);
  }
`;
const Btn = styled.button`
  width: 10rem;
  height: 3.5rem;
  background: rgb(255, 138, 61);
  border: 1px solid rgb(255, 138, 61);
  border-radius: 2.5rem;
  color: white;
  font-size: 1.7rem;

  &:hover {
    background: white;
    color: rgb(255, 138, 61);
  }
`;

export default Detail;
