
varying vec2 vMaskCoord;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;

uniform vec2 uOffset;
uniform vec4 filterClamp;

uniform float alpha;
uniform float npmAlpha;
uniform vec4 maskClamp;

void main(void)
{
    float clip = step(3.5,
    step(maskClamp.x, vMaskCoord.x) +
    step(maskClamp.y, vMaskCoord.y) +
    step(vMaskCoord.x, maskClamp.z) +
    step(vMaskCoord.y, maskClamp.w));


    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    float mask = alphaMul * masky.r * clip; 

    vec4 color = vec4(0.0);

    // create shrink clamp to mask?
    vec4 shrinkClamp = vec4(
        max(filterClamp.x, maskClamp.x),
        max(filterClamp.y, maskClamp.y),
        min(filterClamp.z, maskClamp.z),
        min(filterClamp.w, maskClamp.w)
    );

    // Sample top left pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y), shrinkClamp.xy, shrinkClamp.zw));

    // Sample top right pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y), shrinkClamp.xy, shrinkClamp.zw));

    // Sample bottom right pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y), shrinkClamp.xy, shrinkClamp.zw));

    // Sample bottom left pixel
    color += texture2D(uSampler, clamp(vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y), shrinkClamp.xy, shrinkClamp.zw));

    // Average
    color *= 0.25;

    gl_FragColor = original * (1.0 - mask) + color * mask;
}
