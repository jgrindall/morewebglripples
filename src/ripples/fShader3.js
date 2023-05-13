
const fragmentShader = `
uniform vec2 u_resolution;
uniform vec3 u_mouse;
uniform float u_time;
uniform sampler2D u_buffer;
uniform sampler2D u_texture;
uniform sampler2D u_environment;
uniform bool u_renderpass;

uniform int u_frame;

const float bias = 0.2;
const float scale = 5.0;
const float power = 20.0;

const vec3 blue = vec3(0.4, 0.6, 0.9);

vec4 renderRipples() {
    
    float gap_x = 5.0 / u_resolution.x;
    float gap_y = 5.0 / u_resolution.y;

    vec2 _sample = gl_FragCoord.xy / u_resolution.xy;

    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    float ratio = u_resolution.x / u_resolution.y;
    vec2 mouse = u_mouse.xy - uv;

    vec4 fragcolour = texture2D(u_buffer, _sample);

    float t = texture2D(u_buffer, _sample - vec2(0.0, gap_y), 1.0).x;
    float r = texture2D(u_buffer, _sample - vec2(gap_x, 0.0), 1.0).x;
    float b = texture2D(u_buffer, _sample + vec2(gap_x, 0.0), 1.0).x;
    float l = texture2D(u_buffer, _sample + vec2(0.0, gap_y), 1.0).x;

    float shade = 0.0;
    if(u_mouse.z == 1.0) {
        float _sin = sin(u_time * 10.0) * 0.001;
        shade = smoothstep(0.05 + _sin, 0.0, length(mouse));
    }
    float d;
    if(u_frame < 5){
        d = 0.5;
    }
    else{
        float attenuation = 0.8;
        d = shade;
        d += -(fragcolour.y - 0.5)*2.0 + (t + r + b + l - 2.0);
        d *= attenuation;
        d = d*0.5 + 0.5;
    }
    fragcolour = vec4(d, fragcolour.x, 0, 0);
    return fragcolour;
}

vec3 normalizesum(vec3 a, vec3 b){
    return normalize(a + b);
}

vec3 get_normal(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float g = 0.002;
    float fx = texture2D(u_buffer, uv + vec2(g, 0.0)).r;
    float fy = texture2D(u_buffer, uv + vec2(0.0, g)).r;
    float f =  texture2D(u_buffer, uv + vec2(0.0, 0.0)).r;

    return vec3((fx - f)/g, (fy - f)/g, 0) * 0.5;
}

vec4 renderPass() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec3 uv_up = vec3(uv, 1.0);
    vec3 uv_down = vec3(uv, -1.0);
    vec3 surfacePos = vec3(uv, 0.0);
    vec3 ray = normalize(vec3(uv, 1.0));
    vec3 normal = vec3(0.0, 0.0, -1.0);

    vec3 v = get_normal();

    normal = normalizesum(normal, v);
    float a = 1.0 + dot(normalizesum(surfacePos, - uv_down), normal);
    float shade = bias + (scale * pow(a, power));
    vec3 reflect_ray = reflect(uv_up, normal);
    vec3 env = texture2D(u_texture, reflect_ray.xy).rgb;
    
    vec3 env1 = texture2D(u_environment, reflect_ray.xy).rgb;

    vec3 tex = env * shade;
    vec3 texCol = (0.5*blue + tex + 0.3*env1) / 2.0;
    return vec4(texCol, 1.0);
}

void main() {
    if(u_renderpass) {
        gl_FragColor = renderRipples();
    }
    else {
        gl_FragColor = renderPass();
    }
}
`

export default fragmentShader