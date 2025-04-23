import streamlit as st
import requests
from PIL import Image
from io import BytesIO

st.set_page_config(page_title="Salon ABC - Virtual Hair Style")
st.title("Salon ABC - Virtual Hair Style")

# Upload ảnh từ local
input_face = st.file_uploader("Chọn ảnh khuôn mặt bạn", type=["png", "jpg", "jpeg"])
hair_shape = st.file_uploader("Chọn ảnh mẫu tóc", type=["png"])
hair_color = st.file_uploader("Chọn ảnh màu tóc", type=["png"])

# Khi bấm nút thì gửi ảnh lên server Colab xử lý
if st.button("Change me!!!"):
    if input_face and hair_shape and hair_color:
        with st.spinner("Đang xử lý..."):

            # gửi multipart request lên server Colab (thay bằng đúng URL bạn lấy từ ngrok)
            response = requests.post(
                "https://537c-34-126-191-202.ngrok-free.app/swap/",
                files={
                    "face": (input_face.name, input_face.getvalue(), input_face.type),
                    "shape": (hair_shape.name, hair_shape.getvalue(), hair_shape.type),
                    "color": (hair_color.name, hair_color.getvalue(), hair_color.type),
                },
            )

            # kiểm tra và hiển thị kết quả
            if response.status_code == 200:
                result_img = Image.open(BytesIO(response.content))
                st.image(result_img, caption="Kết quả", use_column_width=True)
            else:
                st.error("Lỗi xử lý từ server!")
