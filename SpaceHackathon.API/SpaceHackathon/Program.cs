using SpaceHackathon.Hubs;
using SpaceHackathon.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSignalR(options => {
    options.EnableDetailedErrors = true; // Hata olursa Next.js'e 'Neden' olduðunu bassýn.
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

builder.Services.AddCors(options => {
    options.AddPolicy("NextJsPolicy", policy => {
        policy.WithOrigins("http://localhost:3000") 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
builder.Services.AddHostedService<TelemetryWorker>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("NextJsPolicy");
app.UseRouting();

app.MapHub<TelemetryHub>("/telemetryHub");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
