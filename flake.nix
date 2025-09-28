{
  description = "Nix Development Shell";

  inputs = {
    nixpkgs.url      = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url  = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        nixpatchbins = pkgs.writers.writeBashBin "nixpatchbins" ''
          set -o errexit || exit; set -o nounset; set -o pipefail

          NIX_LD="${pkgs.lib.fileContents "${pkgs.stdenv.cc}/nix-support/dynamic-linker"}";
          NIX_LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
            pkgs.stdenv.cc.cc
          ]}";

          if [[ ! -f /etc/os-release ]] || ! grep -q 'ID=nixos' /etc/os-release; then
            exit 0 # Not a NixOS system, skipping patching.
          fi

          BIN_EXECUTABLES_TO_PATCH=(
            $(cd node_modules/sass-embedded && node -e 'console.log(require.resolve("sass-embedded-linux-x64/dart-sass/src/dart"))')
          )

          for bin_executable_path in "''${BIN_EXECUTABLES_TO_PATCH[@]}"; do
            (set -o xtrace; ${pkgs.lib.getExe pkgs.patchelf} --set-interpreter "$NIX_LD" "$bin_executable_path")
          done
        '';
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = (with pkgs; [
            nodejs
            nil
            nodePackages.svelte-language-server
            nodePackages.typescript-language-server
            nodePackages.prettier
            nixpatchbins
          ]);
        };
      }
    );
}
