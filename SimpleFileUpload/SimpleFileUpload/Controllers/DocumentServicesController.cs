using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace SimpleWebFileUpload.Controllers
{
    public class DocumentServicesController : ApiController
    {
        private static string rootfolder;
        public DocumentServicesController()
        {
            rootfolder = HttpContext.Current.Server.MapPath("~/ContentFiles/Images");
        }

        // POST: /Uploads
        [Route("KBFileServices/Upload")]
        public async Task<HttpResponseMessage> Post([FromUri]string fileName)
        {
            //  Read the information from the BODY as a stream
            Stream requestStream = await Request.Content.ReadAsStreamAsync(); 
            try
            {
                SaveImageFile(requestStream, fileName);
                ExtractThumbnail(fileName);

                return new HttpResponseMessage(HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }
        }

        private void SaveImageFile(Stream requestStream, string fileName)
        {
            var location = GetPath(fileName);

            // Create the destination file 
            Bitmap UploadedBitmap = new Bitmap(requestStream);

            UploadedBitmap.Save(location + ".png", ImageFormat.Png);

            //  flush the buffers...tweak the p-ram.
            requestStream.Close();
        }
        private void ExtractThumbnail(string fileName)
        {
            var location = GetPath(fileName);

            //  Load the existing bitmap file
            Bitmap SourceBitmap = new Bitmap(location + ".png");

            // figure out aspect ratio 
            float AspectRatio = (float)SourceBitmap.Height / SourceBitmap.Width;

            // reduce the filesize by the percentage in the app.config
            var reductionPercent = SimpleFileUpload.Properties.Settings.Default.ImageReductionPercentForThumbnails;
            var reducedWidth = SourceBitmap.Width * reductionPercent;

            //  calculate new size for thumbnail
            SizeF NewSize = new SizeF((float)reducedWidth, (float)reducedWidth * AspectRatio);

            //  create a new bitmap of this size
            Bitmap ThumbnailBitmap = new Bitmap((int)NewSize.Width, (int)NewSize.Height);

            using (Graphics Gfx = Graphics.FromImage(ThumbnailBitmap))
            {
                Gfx.CompositingQuality = CompositingQuality.HighQuality;
                Gfx.InterpolationMode = InterpolationMode.HighQualityBicubic;
                Gfx.CompositingMode = CompositingMode.SourceCopy;
                Gfx.DrawImage(SourceBitmap, 0, 0, NewSize.Width, NewSize.Height);
                using (FileStream Strm = new FileStream(GetThumbnailPath( fileName + ".png"), FileMode.Create))
                {
                    ThumbnailBitmap.Save(Strm, ImageFormat.Png);
                }
            }
        }

        private static string GetPath(string fileName) 
            => Path.Combine(rootfolder, fileName);
        private static string GetThumbnailPath(string fileName)
            => Path.Combine(rootfolder, "Thumbnails", fileName);
    }
}
