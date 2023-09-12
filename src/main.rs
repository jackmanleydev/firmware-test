use axum::{
    body::StreamBody,
    extract::{DefaultBodyLimit, Multipart, Query},
    http::header,
    response::{Html, IntoResponse},
    routing::get,
    Json, Router,
};
use http::Method;
use tokio::time::{sleep, Duration};
use tokio_util::io::ReaderStream;
use tower_http::{
    cors::{Any, CorsLayer},
    limit::RequestBodyLimitLayer,
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(serde::Deserialize)]
pub struct Params {
    f: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "firmware_test=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any);

    let app = Router::new()
        .route("/", get(firmware_page).post(upload_firmware))
        .route("/update", get(update_camera))
        .route("/scripts/main.js", get(get_main_js))
        .route("/styles/main.css", get(get_main_css))
        .route("/cgi-bin/param.cgi", get(get_cgi_param))
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new(
            250 * 1024 * 1024, /* 250mb */
        ))
        .layer(cors.clone())
        .layer(TraceLayer::new_for_http());

    tracing::info!("Starting server...");

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}

pub async fn firmware_page() -> Html<&'static str> {
    let dashboard = include_str!("../public/index.html");
    Html(dashboard)
}

pub async fn upload_firmware(mut multipart: Multipart) -> Json<String> {
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        let file_name = field.file_name().unwrap().to_string();
        let content_type = field.content_type().unwrap().to_string();
        let data = field.bytes().await.unwrap();

        tracing::info!(
            "Length of `{}` (`{}`: `{}`) is {} bytes",
            name,
            file_name,
            content_type,
            data.len()
        );
    }
    sleep(Duration::from_secs(10)).await;
    Json("Firmware successfully uploaded".to_string())
}

pub async fn update_camera() -> Json<String> {
    sleep(Duration::from_secs(30)).await;
    Json("Camera successfully updated".to_string())
}

pub async fn get_cgi_param(param: Query<Params>) -> String {
    if param.f == "get_device_conf" {
        let device_conf = include_str!("../assets/get_device_conf.txt");
        device_conf.to_string()
    } else {
        "Not found".to_string()
    }
}

pub async fn get_main_js() -> impl IntoResponse {
    let main_js = include_str!("../public/scripts/main.js");
    let stream = ReaderStream::new(main_js.as_bytes());
    let body = StreamBody::new(stream);
    let headers = [
        (
            header::CONTENT_TYPE,
            "application/javascript; charset=utf-8",
        ),
        (
            header::CACHE_CONTROL,
            "public, max-age=31536000, immutable, filename=main.js",
        ),
    ];
    (headers, body)
}

pub async fn get_main_css() -> impl IntoResponse {
    let main_css = include_str!("../public/styles/main.css");
    let stream = ReaderStream::new(main_css.as_bytes());
    let body = StreamBody::new(stream);
    let headers = [
        (header::CONTENT_TYPE, "text/css; charset=utf-8"),
        (
            header::CACHE_CONTROL,
            "public, max-age=31536000, immutable, filename=main.css",
        ),
    ];
    (headers, body)
}
